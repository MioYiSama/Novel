package top.mioyi.data

import kotlinx.serialization.Serializable

@Serializable
data class Chapter(
    val id: Int,
    val name: String,
)