package top.mioyi.network

import kotlinx.coroutines.flow.*
import top.mioyi.data.*

fun crawlNovel(novelID: Int): Novel {
    val catalogDocument = worker {
        getCatalogDocument(novelID)
    }

    val novelName = catalogDocument.selectXpath("//h1").text()
    val volumes = mutableListOf<Volume>()
    lateinit var chapters: MutableList<Chapter>

    val chapterIDRegex = Regex("""/novel/\d+/(\d+).html""")

    catalogDocument.selectXpath("""//ul[@class="volume-chapters"]/li""").forEach {
        if (it.hasClass("chapter-bar")) {
            val volumeName = it.selectXpath("./h3").text()
            chapters = mutableListOf()

            volumes.add(Volume(volumeName, chapters))
        }

        if (it.hasClass("jsChapter")) {
            val href = it.selectXpath("./a").attr("href")

            val chapterID = chapterIDRegex.findNumber(href) ?: -1
            val chapterName = it.selectXpath("./a/span").text()

            chapters.add(Chapter(chapterID, chapterName))
        }
    }

    return Novel(novelID, novelName, volumes)
}

fun crawlChapterContent(novelID: Int, chapterID: Int) = flow {
    worker {
        var index = 1

        while (true) {
            val document = getChapterDocument(novelID, chapterID, index++)

            val paragraphs =
                document.selectXpath("""//div[@id="acontent"]/p""")
                    .asSequence()
                    .map { it.text() }
                    .filter { it.isNotBlank() }

            val iterator = paragraphs.iterator()

            if (!iterator.hasNext()) {
                break
            }

            iterator.forEach { emit(it) }
        }
    }
}.buffer()
