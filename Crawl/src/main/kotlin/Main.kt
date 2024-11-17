package top.mioyi

import top.mioyi.data.*

fun main() {
//    println(COOKIES)
    resolveChapterID(Novel.loadFromFile(8)).saveToFile()
}