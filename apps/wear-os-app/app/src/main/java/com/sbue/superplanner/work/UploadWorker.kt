package com.sbue.superplanner.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.sbue.superplanner.data.ServiceLocator
import com.sbue.superplanner.network.LocationUploader
import com.sbue.superplanner.network.UploadStatus

class UploadWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val uploader = LocationUploader(
            ServiceLocator.locationRepository(applicationContext),
            ServiceLocator.httpClient()
        )
        return when (uploader.uploadAll().status) {
            UploadStatus.NO_DATA -> Result.success()
            UploadStatus.SUCCESS -> Result.success()
            UploadStatus.RETRY -> Result.retry()
        }
    }
}
