package com.sbue.superplanner.data

import android.content.Context
import okhttp3.OkHttpClient

object ServiceLocator {
    @Volatile
    private var repository: LocationRepository? = null

    @Volatile
    private var httpClient: OkHttpClient? = null

    fun locationRepository(context: Context): LocationRepository {
        return repository ?: synchronized(this) {
            repository ?: LocationRepository(AppDatabase.getInstance(context)).also {
                repository = it
            }
        }
    }

    fun httpClient(): OkHttpClient {
        return httpClient ?: synchronized(this) {
            httpClient ?: OkHttpClient.Builder().build().also { httpClient = it }
        }
    }
}
