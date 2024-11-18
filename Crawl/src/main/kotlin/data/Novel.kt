package top.mioyi.data

import kotlinx.serialization.*
import kotlin.io.path.*

@Serializable
data class Novel(
    val id: Int,
    val name: String,
    val volumes: List<Volume>,
) {
    companion object {
        fun loadFromFile(novelID: Int) =
            json.decodeFromString<Novel>(Path("novels/$novelID.json").readText())
    }

    fun saveToFile() =
        Path("novels/${id}.json").createParentDirectories().writeText(json.encodeToString(this))
}