import streamlit as st

st.set_page_config(layout="wide")
st.title('Share some inputs for the AI to help you better')
st.text("")

col1, col2 = st.columns(2)

with col1:

    product_brief = st.text_input('What are you selling give a brief description if possible?', '.')
    st.text("")

    saes_person_job = st.text_input('What is your job role?', '..')
    st.text("")

    sale_person_motive = st.text('')
    st.text_input('What is your motive?', '...')


with col2:
    job_role_cr = st.text_input('Role of the company representative?', '....')
    st.text("")
    company_business = st.text_input('What is their company about?', '.....')