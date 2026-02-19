package com.sbue.superplanner.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface LocationSampleDao {
    @Insert
    suspend fun insert(sample: LocationSampleEntity): Long

    @Query("SELECT COUNT(*) FROM location_samples")
    suspend fun count(): Int

    @Query("SELECT COUNT(*) FROM location_samples")
    fun observeCount(): Flow<Int>

    @Query("SELECT tsMs FROM location_samples ORDER BY tsMs DESC LIMIT 1")
    fun observeLatestTimestamp(): Flow<Long?>

    @Query("SELECT tsMs FROM location_samples ORDER BY tsMs DESC LIMIT 1")
    suspend fun latestTimestamp(): Long?

    @Query("SELECT * FROM location_samples ORDER BY tsMs ASC LIMIT :limit")
    suspend fun getOldest(limit: Int): List<LocationSampleEntity>

    @Query("DELETE FROM location_samples WHERE id IN (:ids)")
    suspend fun deleteByIds(ids: List<Long>)

    @Query(
        "DELETE FROM location_samples " +
            "WHERE id IN (SELECT id FROM location_samples ORDER BY tsMs ASC LIMIT :limit)"
    )
    suspend fun deleteOldest(limit: Int)
}
