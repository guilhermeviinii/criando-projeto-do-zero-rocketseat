import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Head from 'next/head';

import { FaCalendarAlt, FaClock, FaRegClock } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post: postFind }: PostProps): JSX.Element {
  const router = useRouter();

  const post = {
    first_publication_date: format(
      new Date(postFind.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
    title: postFind.data.title,
    author: postFind.data.author,
    banner: postFind.data.banner.url,
    contentHeader: {
      heading: postFind.data.content[0].heading,
      body: RichText.asHtml(postFind.data.content[0].body),
    },
    contentBody: {
      heading: postFind.data.content[1]?.heading
        ? postFind.data.content[1]?.heading
        : '',
      body: postFind.data.content[1]?.body
        ? RichText.asHtml(postFind.data.content[1]?.body)
        : '',
    },
  };

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Post | {post.title}</title>
      </Head>
      <Header />
      <figure className={styles.bannerPost}>
        <img src={post.banner} alt={post.title} />
      </figure>
      <div className={styles.container}>
        <header className={styles.postContent}>
          <h1>{post.title}</h1>
          <div className={styles.postContent__infoHeader}>
            <div>
              <FaCalendarAlt />
              {post.first_publication_date}
            </div>
            <span>{post.author}</span>
            <div>
              <FaRegClock /> 4 min
            </div>
          </div>
        </header>
        <div className={styles.content}>
          <h1>{post.contentHeader.heading}</h1>
          <div dangerouslySetInnerHTML={{ __html: post.contentHeader.body }} />
        </div>
        <div className={styles.content}>
          <h1>{post.contentBody.heading}</h1>
          <div dangerouslySetInnerHTML={{ __html: post.contentBody.body }} />
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);
  const paths = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();

  const slug = params.slug as string;

  const postFind = await prismic.getByUID('posts', slug, {});

  return {
    props: {
      post: postFind,
    },
    revalidate: 1,
  };
};
