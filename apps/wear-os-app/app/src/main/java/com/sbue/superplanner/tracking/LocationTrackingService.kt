package com.sbue.superplanner.tracking

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.sbue.superplanner.AppConfig
import com.sbue.superplanner.data.LocationSampleEntity
import com.sbue.superplanner.data.ServiceLocator
import com.sbue.superplanner.presentation.MainActivity
import com.sbue.superplanner.work.TrackingScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class LocationTrackingService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var locationCallback: LocationCallback? = null

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopTrackingAndSelf(clearEnabled = true)
            return START_NOT_STICKY
        }

        if (intent?.action == ACTION_START) {
            TrackingPreferences.setTrackingEnabled(this, true)
        }

        if (!TrackingPreferences.isTrackingEnabled(this)) {
            stopTrackingAndSelf(clearEnabled = false)
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        startLocationUpdates()
        TrackingScheduler.schedulePeriodicUpload(this)

        return START_STICKY
    }

    override fun onDestroy() {
        stopLocationUpdates()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startLocationUpdates() {
        if (locationCallback != null) {
            return
        }
        if (!hasLocationPermission()) {
            Log.w(AppConfig.LOG_TAG, "Foreground tracking stopped: location permission missing.")
            stopTrackingAndSelf(clearEnabled = false)
            return
        }

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location = result.lastLocation ?: return
                serviceScope.launch {
                    ServiceLocator.locationRepository(applicationContext).insertAndTrim(
                        LocationSampleEntity(
                            tsMs = location.time.takeIf { it > 0 } ?: System.currentTimeMillis(),
                            lat = location.latitude,
                            lon = location.longitude,
                            accuracyM = location.accuracy
                        ),
                        AppConfig.MAX_QUEUE_SIZE
                    )
                }
            }
        }

        val request = LocationRequest.Builder(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            AppConfig.CAPTURE_INTERVAL_MS
        )
            .setMinUpdateIntervalMillis(AppConfig.CAPTURE_INTERVAL_MS)
            .setMaxUpdateDelayMillis(AppConfig.CAPTURE_INTERVAL_MS)
            .setWaitForAccurateLocation(false)
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
            locationCallback = callback
        } catch (exception: SecurityException) {
            Log.w(AppConfig.LOG_TAG, "Unable to start location updates.", exception)
            stopTrackingAndSelf(clearEnabled = false)
        }
    }

    private fun stopLocationUpdates() {
        val callback = locationCallback ?: return
        runCatching { fusedLocationClient.removeLocationUpdates(callback) }
        locationCallback = null
    }

    private fun stopTrackingAndSelf(clearEnabled: Boolean) {
        stopLocationUpdates()
        if (clearEnabled) {
            TrackingPreferences.setTrackingEnabled(this, false)
            TrackingScheduler.cancelPeriodicUpload(this)
            TrackingScheduler.cancelPendingUpload(this)
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val manager = getSystemService(NotificationManager::class.java)
        val existing = manager.getNotificationChannel(NOTIFICATION_CHANNEL_ID)
        if (existing != null) {
            return
        }

        manager.createNotificationChannel(
            NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                getString(com.sbue.superplanner.R.string.tracking_notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            )
        )
    }

    private fun buildNotification() =
        NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(com.sbue.superplanner.R.mipmap.ic_launcher)
            .setContentTitle(getString(com.sbue.superplanner.R.string.tracking_notification_title))
            .setContentText(getString(com.sbue.superplanner.R.string.tracking_notification_text))
            .setOngoing(true)
            .setContentIntent(mainPendingIntent())
            .build()

    private fun mainPendingIntent(): PendingIntent {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    companion object {
        private const val ACTION_START = "com.sbue.superplanner.action.START_TRACKING"
        private const val ACTION_STOP = "com.sbue.superplanner.action.STOP_TRACKING"
        private const val NOTIFICATION_CHANNEL_ID = "location_tracking"
        private const val NOTIFICATION_ID = 2201

        fun start(context: Context) {
            val intent = Intent(context, LocationTrackingService::class.java).apply {
                action = ACTION_START
            }
            runCatching {
                ContextCompat.startForegroundService(context, intent)
            }.onFailure { exception ->
                Log.w(AppConfig.LOG_TAG, "Failed to start tracking foreground service.", exception)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, LocationTrackingService::class.java).apply {
                action = ACTION_STOP
            }
            runCatching {
                context.startService(intent)
            }.onFailure { exception ->
                Log.w(AppConfig.LOG_TAG, "Failed to stop tracking foreground service.", exception)
            }
        }
    }
}
