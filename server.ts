import express from "express";
import {graphqlHTTP} from 'express-graphql';
import { buildSchema } from 'graphql';
import * as crypto from "crypto";

const schema = buildSchema(`
  input PostInput {
    title: String
    content: String
  }
  type Post {
    id: ID! 
    title: String
    content: String
  }
  type Query {
    getPost(id: ID!): Post
    getPosts: [Post]
  }
  type Mutation {
    createPost(input: PostInput): Post
    updatePost(id: ID!, input: PostInput): Post
    deletePost(id: ID!): String
  }
`);

class Post {
  id: number;
  title: string;
  content:string;
  constructor(id, {title, content}) {
    this.id = id;
    this.title = title;
    this.content = content;
  }
}

var database = {};

const root = {
  getPost: ({ id }) => {
    if(!database[id]) {
      throw new Error(`No post with id ${id}`);
    }

    return new Post(id, database[id]);
  },
  getPosts: () => {
    const posts: any[] = [];
    for (let id in database) {
      if(database.hasOwnProperty(id)) {
        const post = database[id];
        posts.push(new Post(id, post));
      }
    }

    return posts;
  },
  createPost: ({input}) => {
    const id = crypto.randomBytes(10).toString('hex');
    database[id] = input;
    return new Post(id, input);
  },
  updatePost: ({id, input}) => {
    if(!database[id]) {
      throw new Error(`No post with id ${id}`);
    }
    database[id] = input;
    return new Post(id, input);
  },
  deletePost: ({id}) => {
    var newDatabase: any = {};
    for (let post_id in database) {
      if(database.hasOwnProperty(id)) {
        if(id !== post_id) {
          newDatabase[id] = database[id];
        }
      }
    }
    database = newDatabase;
    return id;
  }
}

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true,
}));
app.listen(4000, () => {
  console.log('running GraphQL API server at http://localhost:4000/graphql');
})