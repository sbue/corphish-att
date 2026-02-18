package com.sbue.superplanner.work

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.sbue.superplanner.AppConfig
import java.util.concurrent.TimeUnit

object TrackingScheduler {
    fun schedulePeriodicCapture(context: Context) {
        val request = PeriodicWorkRequestBuilder<CaptureLocationWorker>(
            15,
            TimeUnit.MINUTES
        ).build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                AppConfig.CAPTURE_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
    }

    fun cancelPeriodicCapture(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(AppConfig.CAPTURE_WORK_NAME)
    }

    fun enqueueUpload(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val request = OneTimeWorkRequestBuilder<UploadWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                AppConfig.UPLOAD_WORK_NAME,
                ExistingWorkPolicy.KEEP,
                request
            )
    }

    fun enqueueImmediateCapture(context: Context) {
        val request = OneTimeWorkRequestBuilder<CaptureLocationWorker>().build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                AppConfig.CAPTURE_NOW_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
    }

    fun cancelPendingUpload(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(AppConfig.UPLOAD_WORK_NAME)
    }
}
