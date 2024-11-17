package top.mioyi.data

import kotlinx.serialization.Serializable

@Serializable
data class Volume(
    val name: String,
    val chapters: List<Chapter>,
)
