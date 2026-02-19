package com.sbue.corphish.work

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.sbue.corphish.AppConfig

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
        // WorkManager periodic work has a 15-minute minimum interval.
        // For temporary minute-scale testing, rely on the foreground service loop
        // and trigger an immediate upload attempt here.
        enqueueUpload(context)
    }

    fun cancelPeriodicUpload(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(AppConfig.UPLOAD_PERIODIC_WORK_NAME)
    }

    fun cancelPendingUpload(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(AppConfig.UPLOAD_WORK_NAME)
    }
}
