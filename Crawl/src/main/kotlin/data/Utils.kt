package top.mioyi.data

import top.mioyi.network.*

private val prevPageRegex = Regex("""var prevpage="/novel/\d+/(\d+).html"""")
private val nextPageRegex = Regex("""var nextpage="/novel/\d+/(\d+)_\d+.html"""")

fun Regex.findNumber(source: String) = find(source)?.groupValues?.get(1)?.toInt()

private fun nextChapterID(novelID: Int, chapter: Chapter) = worker<Int> {
    var index = 1

    while (true) {
        val content = getChapterDocument(novelID, chapter.id, index++).html()
        val number = nextPageRegex.findNumber(content) ?: return -1

        if (number != chapter.id) {
            return number
        }
    }

    return -1
}

fun resolveChapterID(novel: Novel): Novel = worker {
    val newVolumes =
        novel.volumes.map {
            val newChapters = buildList {
                val chapters = it.chapters

                chapters.forEachIndexed { index, chapter ->
                    if (chapter.id == -1) {
                        val content = getDocument("/novel/${novel.id}/${chapters[index + 1].id}.html").html()
                        val newID = prevPageRegex.findNumber(content) ?: -1

                        add(Chapter(newID, chapter.name))
                    } else {
                        add(chapter)
                    }
                }
            }

            Volume(it.name, newChapters)
        }

    return Novel(novel.id, novel.name, newVolumes)
}