package top.mioyi.network

import org.jsoup.nodes.Document

inline fun <T> worker(f: Worker.() -> T) = Worker().use(f)

fun Worker.getCatalogDocument(novelID: Int): Document =
    getDocument("/novel/${novelID}/catalog")

fun Worker.getChapterDocument(novelID: Int, chapterID: Int, index: Int = 1): Document =
    getDocument("/novel/${novelID}/${chapterID}_${index}.html")
