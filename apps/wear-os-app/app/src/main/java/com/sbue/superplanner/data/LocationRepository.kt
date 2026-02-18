package com.sbue.superplanner.data

import androidx.room.withTransaction
import kotlinx.coroutines.flow.Flow

class LocationRepository(private val database: AppDatabase) {
    private val dao = database.locationSampleDao()

    val queueCount: Flow<Int> = dao.observeCount()
    val latestTimestamp: Flow<Long?> = dao.observeLatestTimestamp()

    suspend fun insertAndTrim(sample: LocationSampleEntity, maxRows: Int) {
        database.withTransaction {
            dao.insert(sample)
            val overflow = dao.count() - maxRows
            if (overflow > 0) {
                dao.deleteOldest(overflow)
            }
        }
    }

    suspend fun getOldestBatch(limit: Int): List<LocationSampleEntity> {
        return dao.getOldest(limit)
    }

    suspend fun deleteByIds(ids: List<Long>) {
        if (ids.isNotEmpty()) {
            dao.deleteByIds(ids)
        }
    }

    suspend fun count(): Int {
        return dao.count()
    }

    suspend fun latestTimestampValue(): Long? {
        return dao.latestTimestamp()
    }
}
