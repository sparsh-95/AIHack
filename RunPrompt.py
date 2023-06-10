from langchain.chains import LLMChain
from langchain.llms import OpenAI
from langchain.vectorstores import Pinecone
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.prompts import PromptTemplate
import streamlit as st
import pinecone
import redis

embeddings = OpenAIEmbeddings(openai_api_key="openaikey")

pinecone.init(
    api_key="pineconekey",  # find at app.pinecone.io
    environment='us-east4-gcp'  # next to api key in console
)

index_name = 'redis-doc-index'

st.title('Client Conversation')
prompt = st.text_input('Plug in your prompt here') 

query = prompt

llm = OpenAI(temperature=0, openai_api_key="openaikey")

r = redis.Redis(host='localhost', port=6379, db=0)

query_template_current_context = PromptTemplate(
    input_variables = ['input'],
    template="""
            Persona: 
            Sales Development Manager: Job - Works at Redis, Motive: To sell the redis database as a product, 
            Company representative: Job - Director of Engineering in Uber, Company Description: Online cab aggregator

            You are an assistant to a sales development manager in his sales call with a company representative to which he is trying to sell.
            You need to help him with questions and suggestions, after being provided with a piece of conversation and context from the previous conversation. 
            It's important to be very specific and provide output in max 1 bullet points. 
            I am providing you with the persona of the sales development manager and the company representative.

            conversation: {input}

    """ )

query_template_question = PromptTemplate(
    input_variables = ['input', 'past_context', 'docs'],
    template="""
            You are an enthusiastic assistant to a sales manager at Redis. 
            You help the manager in his sales call with potential client representative to which he is trying to sell. 
            The persona of client representative is Head of Engineering. 
            You will be provided a transcript of their current conversation & a brief context from previous conversations. 
            Using the information mainly, you need to ask follow up questions. 
            Be very specific and provide output in max 1 line.

            Context     from previous conversation: {past_context}
            Current     Conversation: {input} 

            Also provide some suggestions from the doc and if you dont have suggestions from the doc dont respond anything: {docs}
            
    """ )


first_chain = LLMChain(llm=llm, prompt=query_template_current_context)
second_chain = LLMChain(llm=llm, prompt=query_template_question)
#Run and print on screen if there is a prompt
if prompt:
    docsearch = Pinecone.from_existing_index(index_name, embeddings)
    docs = docsearch.similarity_search(query)
    output_context = first_chain.run(input=query)
    r.lpush("cc:2", output_context)
    past_context = r.lrange("cc:2", 0, 4)
    question_to_ask = second_chain.run(input=query, past_context=past_context, docs=docs)
    st.markdown(question_to_ask, unsafe_allow_html=False, help=None)
