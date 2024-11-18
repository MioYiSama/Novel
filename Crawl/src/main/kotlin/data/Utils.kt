package top.mioyi.data

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json

@OptIn(ExperimentalSerializationApi::class)
val json = Json {
    prettyPrint = true
    prettyPrintIndent = ' '.toString().repeat(2)
}

fun Regex.findNumber(source: String) = find(source)?.groupValues?.get(1)?.toInt()
