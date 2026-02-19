package com.sbue.superplanner.work

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.sbue.superplanner.AppConfig

object TrackingScheduler {
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

    fun schedulePeriodicUpload(context: Context) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val request = PeriodicWorkRequestBuilder<UploadWorker>(
            AppConfig.UPLOAD_PERIOD_MINUTES,
            java.util.concurrent.TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                AppConfig.UPLOAD_PERIODIC_WORK_NAME,
                androidx.work.ExistingPeriodicWorkPolicy.UPDATE,
                request
            )
    }

    fun cancelPeriodicUpload(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(AppConfig.UPLOAD_PERIODIC_WORK_NAME)
    }

    fun cancelPendingUpload(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(AppConfig.UPLOAD_WORK_NAME)
    }
}
