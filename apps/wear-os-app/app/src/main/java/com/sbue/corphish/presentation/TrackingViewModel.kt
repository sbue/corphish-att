package com.sbue.corphish.presentation

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.sbue.corphish.data.ServiceLocator
import com.sbue.corphish.location.CaptureOutcome
import com.sbue.corphish.location.CaptureResult
import com.sbue.corphish.location.LocationCapture
import com.sbue.corphish.network.LocationUploader
import com.sbue.corphish.network.UploadStatus
import com.sbue.corphish.tracking.LocationTrackingService
import com.sbue.corphish.tracking.TrackingPreferences
import com.sbue.corphish.work.TrackingScheduler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TrackingViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = ServiceLocator.locationRepository(application)

    private val queueCountState = MutableStateFlow(0)
    val queueCount: StateFlow<Int> = queueCountState.asStateFlow()

    private val lastCaptureTsState = MutableStateFlow<Long?>(null)
    val lastCaptureTs: StateFlow<Long?> = lastCaptureTsState.asStateFlow()

    private val trackingEnabledState = MutableStateFlow(false)
    val trackingEnabled: StateFlow<Boolean> = trackingEnabledState.asStateFlow()

    private val statusState = MutableStateFlow<UiStatus?>(null)
    val status: StateFlow<UiStatus?> = statusState.asStateFlow()

    init {
        trackingEnabledState.value = TrackingPreferences.isTrackingEnabled(application)
        viewModelScope.launch(Dispatchers.IO) {
            repository.queueCount.collect { queueCountState.value = it }
        }
        viewModelScope.launch(Dispatchers.IO) {
            repository.latestTimestamp.collect { lastCaptureTsState.value = it }
        }
    }

    fun setTrackingEnabled(enabled: Boolean) {
        val app = getApplication<Application>()
        TrackingPreferences.setTrackingEnabled(app, enabled)
        if (enabled) {
            TrackingScheduler.schedulePeriodicUpload(app)
            LocationTrackingService.start(app)
            updateStatus("Tracking enabled.", isError = false)
        } else {
            LocationTrackingService.stop(app)
            TrackingScheduler.cancelPeriodicUpload(app)
            TrackingScheduler.cancelPendingUpload(app)
            updateStatus("Tracking disabled.", isError = false)
        }
        trackingEnabledState.value = enabled
    }

    fun captureNow() {
        updateStatus("Capturing location...", isError = false)
        viewModelScope.launch(Dispatchers.IO) {
            val result: CaptureResult =
                LocationCapture(getApplication()).captureOnce(enqueueUpload = false)
            when (result.outcome) {
                CaptureOutcome.SUCCESS -> {
                    val count = result.queueCount ?: repository.count()
                    queueCountState.value = count
                    lastCaptureTsState.value = repository.latestTimestampValue()
                    updateStatus("Captured location. Queue size: $count", isError = false)
                }
                CaptureOutcome.MISSING_PERMISSION -> updateStatus(
                    "Location permission missing.",
                    isError = true
                )
                CaptureOutcome.LOCATION_DISABLED -> updateStatus(
                    "Location is off. Enable in Settings.",
                    isError = true
                )
                CaptureOutcome.NO_FIX -> updateStatus(
                    "No location fix. Check location settings.",
                    isError = true
                )
            }
        }
    }

    fun uploadNow() {
        viewModelScope.launch(Dispatchers.IO) {
            val uploader = LocationUploader(
                ServiceLocator.locationRepository(getApplication()),
                ServiceLocator.httpClient()
            )
            val summary = uploader.uploadAll()
            when (summary.status) {
                UploadStatus.NO_DATA -> updateStatus("Queue empty.", isError = false)
                UploadStatus.SUCCESS -> {
                    queueCountState.value = repository.count()
                    updateStatus(
                        "Uploaded ${summary.uploadedCount} locations.",
                        isError = false
                    )
                }
                UploadStatus.RETRY -> updateStatus("Upload failed. Will retry.", isError = true)
            }
        }
    }

    fun updateStatus(message: String, isError: Boolean) {
        statusState.value = UiStatus(message, isError)
    }
}

data class UiStatus(val message: String, val isError: Boolean)
