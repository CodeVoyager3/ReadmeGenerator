import { useState } from 'react'
import './index.css'

function App() {
  const [userName, setUserName] = useState("")
  const [repoName, setRepoName] = useState("")
  const [repoContent, setRepoContent] = useState("")
  const [repoType, setRepoType] = useState("public")
  const [loading, setLoading] = useState(false)
  const [generatedReadme, setGeneratedReadme] = useState('')
  const [error, setError] = useState('')
  const submitHandler = (e) => {
    e.preventDefault()
    setLoading(true);
    getData(userName, repoName)
      .then(content => {
        setRepoContent(content);
        return sendData(content);
      })
      .then(readme => {
        setGeneratedReadme(readme.candidates[0].content.parts[0].text)
        console.log("README generated!");
        setLoading(false);
      })
      .catch(error => {
        console.error("Error:", error);
        setLoading(false);
      });
  }
  const repoTypeHandler = (e) => {
    setRepoType(e.target.value)
  }
  const userNameHandler = (e) => {
    setUserName(e.target.value)
  }
  const repoNameHandler = (e) => {
    setRepoName(e.target.value)
  }
  const getData = async (user, repo, path = '') => {
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    let allContent = "";
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'README',
      'Authorization': `token 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`
    };
    let resp = await fetch(url, { headers })
    // we are handling possible errors here
    if (!resp.ok) {
      if (resp.status === 404) {
        const errorMsg = `Repo not found. If it's private, make sure your token has access.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      } else if (resp.status === 403) {
        const errorMsg = `Access denied. Check token permissions or rate limits.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      } else if (resp.status === 401) {
        const errorMsg = `Bad token. Please check your GitHub token.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      const errorMsg = `GitHub API error: ${resp.status}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    let repoData = await resp.json()
    const validExtensions = [
      "js", "ts", "jsx", "tsx", "html", "css", "scss", "md", "json", "txt",
      "py", "java", "cpp", "c", "go", "rs", "php", "rb", "swift", "kt", "dart", "vue"
    ];
    for (const element of repoData) {
      if (element.type === "file") {
        const ext = element.name.split('.').pop()?.toLowerCase();
        let codeFile = '';
        if (validExtensions.includes(ext)) {
          if (element.content && repoType === "private") {
            codeFile = atob(element.content);
          } else {
            let codeContent = await fetch(element.download_url)
            codeFile = await codeContent.text()
          }
          allContent += `${element.name} \n\n`;
          allContent += codeFile;
        }
      } else if (element.type === "dir") {
        // Now we are checking some folder like "src" which could contain code
        const srcContent = await getData(user, repo, element.path);
        console.log(srcContent);
        allContent += srcContent;
      }
    }
    return allContent
  }
  const sendData = async (prompt) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDd1iCj_hZKmvw7pxveYs8IRcUgc1Cdc5A`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert in creating professional README.md files for GitHub repositories.
Based on the following information, generate a comprehensive and well-formatted README.md file using Markdown. Do not include any extra text before or after the markdown content.
The generated README should include all of the following sections:
- Project Title
- Description
- Features
- Installation Guide
- Tech Stack
- Project Structure
- License Information \n\n\n This is the repo data ${prompt}`
            }]
          }]
        })
      }
    );
    const result = await response.json();
    if (!response.ok || !result.candidates) {
      setError(result.error?.message || "Gemini API error");
      throw new Error(result.error?.message || "Gemini API error");
    }
    return result;
  }
  return (
    <>
      <div id="container" className='bg-black flex md:flex-col flex-col md:justify-center  md:items-center p-4 gap-4 h-screen w-screen'>
        <form
          className={`flex sm:w-full max-w-md pt-0.5  gap-3 p-10 justify-center backdrop-blur-lg  rounded-2xl flex-col items-center ${loading ? 'blur-xl' : 'blur-none'} bg-gray-900`} action="" >
          <input className='bg-black p-4 mt-9 cursor-pointer rounded-xl  h-11 w-full' onChange={userNameHandler} type="text" name="" id="userName" placeholder='Enter your GitHub username' />
          <input type="text" className='bg-black p-4 cursor-pointer rounded-xl h-11 w-full' onChange={repoNameHandler} name="" id="repoName" placeholder='Enter your repo name' />
          <select name="repoType" onChange={repoTypeHandler} className='bg-gray-900 p-3 mt-5 cursor-pointer ml-0 w-full forced-color-adjust-auto rounded-xl text-white' id="">
            <option className='bg-gray-900 cursor-pointer text-white' value="private">Private</option>
            <option className='bg-gray-900 cursor-pointer text-white' value="public">Public</option>
          </select>
          <button onClick={submitHandler} className='bg-blue-900 w-full py-2 rounded-lg border-b-blue-800 mb-0.5 text-white' disabled={loading} type="submit">Generate README</button>
          <span id='error' className='text-red-700'>{error}</span>
        </form>
        <pre className='bg-gray-900 h-[60vh] overflow-y-scroll p-6  w-full  rounded-3xl m-5  text-white'>
          {generatedReadme || 'Your README will be generated here...'}
        </pre>
      </div>
    </>
  )
}

export default App
