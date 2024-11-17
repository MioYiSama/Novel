package top.mioyi.data

import kotlinx.serialization.*
import kotlinx.serialization.json.Json
import kotlin.io.path.*

@OptIn(ExperimentalSerializationApi::class)
private val json = Json {
    prettyPrint = true
    prettyPrintIndent = ' '.toString().repeat(2)
}

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
        Path("novels/${id}.json").writeText(json.encodeToString(this))
}