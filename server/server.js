import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'


// 1. Initialize a new project with: npm init -y, and create an 4 js files .env file 
// 2. npm i "@pinecone-database/pinecone@^0.0.10" dotenv@^16.0.3 langchain@^0.0.73
// 3. Obtain API key from OpenAI (https://platform.openai.com/account/api-keys)
// 4. Obtain API key from Pinecone (https://app.pinecone.io/)
// 5. Enter API keys in .env file
// Optional: if you want to use other file loaders (https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/)
import { PineconeClient } from "@pinecone-database/pinecone";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
//import * as dotenv from "dotenv";
import { createPineconeIndex } from "./1-createPineconeIndex.js";
import { updatePinecone } from "./2-updatePinecone.js";
import { queryPineconeVectorStoreAndQueryLLM } from "./3-queryPineconeAndQueryGPT.js";
// 6. Load environment variables
dotenv.config();
// 7. Set up DirectoryLoader to load documents from the ./documents directory
const loader = new DirectoryLoader("./documents", {
  ".txt": (path) => new TextLoader(path),
  ".pdf": (path) => new PDFLoader(path),
});
const docs = await loader.load();
// 8. Set up variables for the filename, question, and index settings
const question = "Como digito una factura?";
const indexName = "megactivo-info";
const vectorDimension = 1536;
// 9. Initialize Pinecone client with API key and environment
const client = new PineconeClient();
await client.init({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT,
});
// 10. Run the main async function
(async () => {
  // 11. Check if Pinecone index exists and create if necessary
    //await createPineconeIndex(client, indexName, vectorDimension);
  // 12. Update Pinecone vector store with document embeddings
    //await updatePinecone(client, indexName, docs);
  // 13. Query Pinecone vector store and GPT model for an answer
    //await queryPineconeVectorStoreAndQueryLLM(client, indexName, question);
  })();


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from Megactivot'
  })
})

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const taskId = req.body.taskId;
    if (taskId == 0) {
      console.log('entro a embeddings prompt',prompt);
      const mylittleresponse = await queryPineconeVectorStoreAndQueryLLM(client, indexName, prompt);

      res.status(200).send({
        bot: mylittleresponse
      });  
    }
    if (taskId == 1) {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `${prompt}`,
        temperature: 0, // Higher values means the model will take more risks.
        max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
        top_p: 1, // alternative to sampling with temperature, called nucleus sampling
        frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
        presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
      });

      res.status(200).send({
        bot: response.data.choices[0].text
      });
    }
    if (taskId == 2) {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: prompt,
      });
      res.status(200).send({
        bot: completion.data.choices[0].message.content
      });
    }

  } catch (error) {
    console.error(error)
    res.status(500).send(error || 'Something went wrong');
  }
})

app.listen(5000, () => console.log('AI server started on http://localhost:5000'))