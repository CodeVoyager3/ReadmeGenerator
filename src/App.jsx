import { useState } from 'react'
import './index.css'

function App() {
  const [userName, setUserName] = useState("")
  const [repoName, setRepoName] = useState("")
  const [repoType, setRepoType] = useState("public")
  const [loading, setLoading] = useState(false)
  const [generatedReadme, setGeneratedReadme] = useState('')
  const [error, setError] = useState('')
  const submitHandler = (e) => {
    e.preventDefault()
    setLoading(true);
    getData(userName, repoName)
      .then(content => {
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
    let headers;
    if (repoType === "private") {
      headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'README',
        'Authorization': `token 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`
      };
    } else {
      headers = {};
    }
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBbQL72atVFxyLsDKt8BJtC1-BTWH-mvMM`,
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
    <div id="container" className='bg-gradient-to-br from-slate-900 via-black to-indigo-900 flex md:flex-col flex-col md:justify-center md:items-center p-4 gap-6 min-h-screen w-screen'>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          README Generator
        </h1>
        <p className="text-gray-400 text-lg">Transform your repositories into professional documentation</p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
        {/* Form Section */}
        <div className="lg:w-1/2">
          <div className={`relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-500 ${loading ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-10 h-10 border-3 border-blue-400/20 border-t-blue-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-10 h-10 border-3 border-purple-400/20 border-r-purple-400 rounded-full animate-spin animate-reverse"></div>
                  </div>
                  <p className="text-white font-medium">Generating README...</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Username Input */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  GitHub Username
                </label>
                <input 
                  className='w-full bg-black/40 border border-gray-600/50 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-black/50' 
                  onChange={userNameHandler} 
                  type="text" 
                  value={userName}
                  placeholder='Enter your GitHub username' 
                />
              </div>

              {/* Repo Name Input */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" />
                  </svg>
                  Repository Name
                </label>
                <input 
                  type="text" 
                  className='w-full bg-black/40 border border-gray-600/50 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-black/50' 
                  onChange={repoNameHandler} 
                  value={repoName}
                  placeholder='Enter your repository name' 
                />
              </div>

              {/* Repo Type Select */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Repository Type
                </label>
                <div className="relative">
                  <select 
                    name="repoType" 
                    onChange={repoTypeHandler} 
                    value={repoType}
                    className='w-full bg-black/40 border border-gray-600/50 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:bg-black/50 appearance-none cursor-pointer'
                  >
                    <option className='bg-gray-800 text-white' value="public">🌍 Public Repository</option>
                    <option className='bg-gray-800 text-white' value="private">🔒 Private Repository</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button 
                onClick={submitHandler} 
                className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25' 
                disabled={loading || !userName || !repoName}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                    Generating...
                  </span>
                ) : (
                  '✨ Generate README'
                )}
              </button>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-300 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:w-1/2">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[600px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generated README.md
                </h3>
                {generatedReadme && (
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedReadme)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-300 text-sm rounded-lg transition-all duration-200 flex items-center hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="h-full">
              <pre className='h-full overflow-auto p-6 text-gray-300 text-sm leading-relaxed font-mono min-h-[500px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/70'>
                {generatedReadme || (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 text-gray-400">
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-dashed border-gray-600/50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Your README will appear here</p>
                      <p className="text-sm text-gray-500">Fill in your GitHub details and click generate to create professional documentation</p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                        AI-Powered
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse animation-delay-1000"></div>
                        Markdown Ready
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-1.5 animate-pulse animation-delay-2000"></div>
                        Professional
                      </span>
                    </div>
                  </div>
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
