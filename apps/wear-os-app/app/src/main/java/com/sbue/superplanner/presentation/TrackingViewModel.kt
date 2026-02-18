package com.sbue.superplanner.presentation

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.WorkManager
import com.sbue.superplanner.AppConfig
import com.sbue.superplanner.data.ServiceLocator
import com.sbue.superplanner.location.CaptureOutcome
import com.sbue.superplanner.location.CaptureResult
import com.sbue.superplanner.location.LocationCapture
import com.sbue.superplanner.network.LocationUploader
import com.sbue.superplanner.network.UploadStatus
import com.sbue.superplanner.work.TrackingScheduler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TrackingViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = ServiceLocator.locationRepository(application)
    private val workManager = WorkManager.getInstance(application)

    private val queueCountState = MutableStateFlow(0)
    val queueCount: StateFlow<Int> = queueCountState.asStateFlow()

    private val lastCaptureTsState = MutableStateFlow<Long?>(null)
    val lastCaptureTs: StateFlow<Long?> = lastCaptureTsState.asStateFlow()

    private val trackingEnabledState = MutableStateFlow(false)
    val trackingEnabled: StateFlow<Boolean> = trackingEnabledState.asStateFlow()

    private val statusState = MutableStateFlow<UiStatus?>(null)
    val status: StateFlow<UiStatus?> = statusState.asStateFlow()

    init {
        viewModelScope.launch(Dispatchers.IO) {
            trackingEnabledState.value = isCaptureWorkActive()
        }
        viewModelScope.launch(Dispatchers.IO) {
            repository.queueCount.collect { queueCountState.value = it }
        }
        viewModelScope.launch(Dispatchers.IO) {
            repository.latestTimestamp.collect { lastCaptureTsState.value = it }
        }
    }

    fun setTrackingEnabled(enabled: Boolean) {
        if (enabled) {
            TrackingScheduler.schedulePeriodicCapture(getApplication())
            updateStatus("Tracking enabled.", isError = false)
        } else {
            TrackingScheduler.cancelPeriodicCapture(getApplication())
            TrackingScheduler.cancelPendingUpload(getApplication())
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

    private fun isCaptureWorkActive(): Boolean {
        return try {
            val infos = workManager
                .getWorkInfosForUniqueWork(AppConfig.CAPTURE_WORK_NAME)
                .get()
            infos.any { !it.state.isFinished }
        } catch (exception: Exception) {
            false
        }
    }
}

data class UiStatus(val message: String, val isError: Boolean)
