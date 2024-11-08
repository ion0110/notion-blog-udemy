import { NUMBER_OF_POSTS_PER_PAGE } from "@/constants/constants";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

export const getSinglePost = async (slug) => {
    const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID + "",
        filter: {
            property: "Slug",
            formula: {
                string: {
                    equals: slug,
                },
            },
        },
    });

    const page = response.results[0];
    const metadata = getPageMetaData(page)
    // console.log(metadata);

    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdBlocks);
    // console.log(mdString);

    return {
        metadata,
        markdown: mdString,
    };
};

export const getAllPosts = async () => {
    const posts = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID + "",
        page_size: 100,
        filter: {
            property: "公開",
            checkbox: {
                equals: true,
            },
        },
        sorts: [
            {
                property: "作成日時",
                direction: "descending",
            },
        ],
    });

    const allPosts = posts.results;

    return allPosts.map((post) => {
        return getPageMetaData(post);
    });
};

const getPageMetaData = (post) => {

    const getTags = ((tags) => {
        const allTags = tags.map((tag) => {
            return tag.name;
        });
        return allTags;
    });

    return {
        id: post.id,
        title: post.properties.名前.title[0].plain_text,
        description: post.properties.詳細.rich_text[0].plain_text,
        date: post.properties.作成日時.date.start,
        slug: post.properties.Slug.rich_text[0].plain_text,
        tags: getTags(post.properties.タグ.multi_select),
    };
};

/* TOPページ用記事の取得（４つ） */
export const getPostsForTopPage = async (pageSize = 4) => {
    const allPosts = await getAllPosts();
    const fourPosts = allPosts.slice(0, pageSize);
    return fourPosts;
}

/* ページ番号に応じた記事取得 */
export const getPostsByPage = async (page: number) => {
    const allPosts = await getAllPosts();

    const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
    const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

    return allPosts.slice(startIndex, endIndex);
}

export const getNumberOfPages = async () => {
    const allPosts = await getAllPosts();

    return  Math.floor(allPosts.length / NUMBER_OF_POSTS_PER_PAGE) + (allPosts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0);
}

export const getPostsByTagAndPage = async (tagName: string, page: number) => {
    const allPosts = await getAllPosts();
    const posts = allPosts.filter((post) =>
        post.tags.find((tag: string) => tag === tagName)
    );

    const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
    const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

    return posts.slice(startIndex, endIndex);
}

export const getNumberOfPagesByTag = async (tagName: string) => {
    const allPosts = await getAllPosts();
    const posts = allPosts.filter((post) =>
        post.tags.find((tag: string) => tag === tagName)
    );

    return  Math.floor(posts.length / NUMBER_OF_POSTS_PER_PAGE) + (posts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0);
}

export const getAllTags = async () => {
    const allPosts = await getAllPosts();

    const allTagsDuplicationLists = allPosts.flatMap((post) => post.tags);
    const set = new Set(allTagsDuplicationLists);
    const allTagsList = Array.from(set);

    return allTagsList;
};