package top.mioyi.network

import kotlinx.coroutines.flow.*
import top.mioyi.data.*

private val prevPageRegex = Regex("""var prevpage="/novel/\d+/(\d+).html"""")
private val nextPageRegex = Regex("""var nextpage="/novel/\d+/(\d+)(_\d+)?.html"""")

fun Worker.crawlNovel(novelID: Int): Novel {
    val catalogDocument = getCatalogDocument(novelID)

    val novelName = catalogDocument.selectXpath("//h1").text()

    val chapterIDRegex = Regex("""/novel/\d+/(\d+).html""")
    val volumes = mutableListOf<Volume>()
    lateinit var chapters: MutableList<Chapter>

    catalogDocument.selectXpath("""//ul[@class="volume-chapters"]/li""").forEach {
        when {
            it.hasClass("chapter-bar") -> {
                val volumeName = it.selectXpath("./h3").text()
                chapters = mutableListOf()

                volumes.add(Volume(volumeName, chapters))
            }

            it.hasClass("jsChapter") -> {
                val href = it.selectXpath("./a").attr("href")

                val chapterID = chapterIDRegex.findNumber(href) ?: -1
                val chapterName = it.selectXpath("./a/span").text()

                chapters.add(Chapter(chapterID, chapterName))
            }
        }
    }

    return Novel(novelID, novelName, volumes)
}

fun Worker.crawlChapterContent(novelID: Int, chapterID: Int) = flow {
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
}.buffer()

fun Worker.resolveChapterID(novel: Novel): Novel {
    val newVolumes = mutableListOf<Volume>()

    for (volume in novel.volumes) {
        val chapters = volume.chapters
        val lastIndex = chapters.size - 1

        val newChapters = mutableListOf<Chapter>()

        for ((i, chapter) in chapters.withIndex()) {
            if (chapter.id != -1) {
                newChapters.add(chapter)
                continue
            }

            var newID: Int

            when (i) {
                lastIndex -> {
                    val prevChapter = chapters[i - 1]
                    var index = 1

                    while (true) {
                        val content = getChapterDocument(novel.id, prevChapter.id, index++).html()
                        val number = nextPageRegex.findNumber(content) ?: -1

                        if (number != chapter.id) {
                            newID = number
                            break
                        }
                    }
                }

                else -> {
                    val nextChapter = chapters[i + 1]
                    val content = getDocument("/novel/${novel.id}/${nextChapter.id}.html").html()

                    newID = prevPageRegex.findNumber(content) ?: -1
                }
            }

            newChapters.add(Chapter(newID, chapter.name))
        }

        newVolumes.add(Volume(volume.name, newChapters))
    }

    return Novel(novel.id, novel.name, newVolumes)
}