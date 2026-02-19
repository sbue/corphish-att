package com.sbue.corphish.location

import android.content.Context
import android.content.pm.PackageManager
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.sbue.corphish.AppConfig
import com.sbue.corphish.data.LocationSampleEntity
import com.sbue.corphish.data.ServiceLocator
import com.sbue.corphish.work.TrackingScheduler
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import android.location.LocationManager
import kotlin.coroutines.resume

class LocationCapture(private val context: Context) {
    suspend fun captureOnce(enqueueUpload: Boolean): CaptureResult {
        if (!hasLocationPermission()) {
            Log.w(AppConfig.LOG_TAG, "Capture skipped: missing location permission.")
            return CaptureResult(CaptureOutcome.MISSING_PERMISSION)
        }

        val locationManager =
            context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val gpsEnabled = runCatching {
            locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        }.getOrDefault(false)
        val networkEnabled = runCatching {
            locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
        }.getOrDefault(false)

        if (!gpsEnabled && !networkEnabled) {
            Log.w(AppConfig.LOG_TAG, "Capture skipped: location services disabled.")
            return CaptureResult(CaptureOutcome.LOCATION_DISABLED)
        }

        val location = try {
            fetchLocation()
        } catch (exception: Exception) {
            Log.w(AppConfig.LOG_TAG, "Capture failed.", exception)
            null
        }
        if (location == null) {
            Log.w(AppConfig.LOG_TAG, "Capture skipped: location is null.")
            return CaptureResult(CaptureOutcome.NO_FIX)
        }

        val sample = LocationSampleEntity(
            tsMs = location.time.takeIf { it > 0 } ?: System.currentTimeMillis(),
            lat = location.latitude,
            lon = location.longitude,
            accuracyM = location.accuracy
        )

        val repository = ServiceLocator.locationRepository(context)
        repository.insertAndTrim(sample, AppConfig.MAX_QUEUE_SIZE)
        if (enqueueUpload) {
            TrackingScheduler.enqueueUpload(context)
        }

        Log.d(AppConfig.LOG_TAG, "Captured location: ${location.latitude}, ${location.longitude}")
        val count = repository.count()
        return CaptureResult(CaptureOutcome.SUCCESS, count)
    }

    private suspend fun fetchLocation(): android.location.Location? {
        val client = LocationServices.getFusedLocationProviderClient(context)
        val request = LocationRequest.Builder(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            LOCATION_INTERVAL_MS
        )
            .setWaitForAccurateLocation(false)
            .setMaxUpdates(1)
            .build()

        val location = withTimeoutOrNull(LOCATION_TIMEOUT_MS) {
            suspendCancellableCoroutine { continuation ->
                val callback = object : LocationCallback() {
                    override fun onLocationResult(result: LocationResult) {
                        val latest = result.lastLocation
                        if (continuation.isActive) {
                            continuation.resume(latest)
                        }
                        client.removeLocationUpdates(this)
                    }
                }

                try {
                    client.requestLocationUpdates(request, callback, Looper.getMainLooper())
                } catch (exception: Exception) {
                    Log.w(AppConfig.LOG_TAG, "Location request failed.", exception)
                    if (continuation.isActive) {
                        continuation.resume(null)
                    }
                }

                continuation.invokeOnCancellation {
                    client.removeLocationUpdates(callback)
                }
            }
        }

        if (location == null) {
            Log.w(AppConfig.LOG_TAG, "Location request timed out.")
        }

        return location
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private companion object {
        const val LOCATION_TIMEOUT_MS = 20_000L
        const val LOCATION_INTERVAL_MS = 1_000L
    }
}

enum class CaptureOutcome {
    SUCCESS,
    MISSING_PERMISSION,
    LOCATION_DISABLED,
    NO_FIX
}

data class CaptureResult(val outcome: CaptureOutcome, val queueCount: Int? = null)
