import React, { useState, useCallback, useRef } from 'react';
import { ImageFile } from './types';
import { fileToGenerativePart } from './utils/fileUtils';
import { editImageWithPrompt, generateImageFromPrompt } from './services/geminiService';

type Tab = 'editor' | 'generator';

const Spinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const UploadIcon: React.FC = () => (
    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
    </svg>
);

const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
    const [originalImageDataUrl, setOriginalImageDataUrl] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('Change the background of this image to a hall with several people at a lecture');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setEditedImage(null);
            setError(null);
            const imagePart = await fileToGenerativePart(file);
            setOriginalImage(imagePart);
            setOriginalImageDataUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!originalImage || !prompt) {
            setError('Please upload an image and provide a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);
        try {
            const result = await editImageWithPrompt(originalImage, prompt);
            setEditedImage(result);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, prompt]);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                        {originalImageDataUrl ? (
                             <img src={originalImageDataUrl} alt="Original" className="object-contain h-full w-full rounded-lg" />
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadIcon />
                                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-400">PNG, JPG, WEBP (MAX. 10MB)</p>
                            </div>
                        )}
                        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" ref={fileInputRef}/>
                    </label>
                    <p className="mt-2 text-sm text-gray-400">Original Image</p>
                </div>

                <div className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 rounded-lg bg-gray-800">
                    {isLoading && <Spinner />}
                    {editedImage && !isLoading && (
                        <img src={editedImage} alt="Edited" className="object-contain h-full w-full rounded-lg" />
                    )}
                    {!isLoading && !editedImage && (
                        <div className="text-gray-500">Edited image will appear here</div>
                    )}
                    <p className="absolute bottom-2 mt-2 text-sm text-gray-400">Result</p>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the changes you want..."
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                />
            </div>

            {error && <div className="p-4 text-sm text-red-400 bg-red-900/50 rounded-lg">{error}</div>}

            <button
                onClick={handleSubmit}
                disabled={isLoading || !originalImage}
                className="w-full flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isLoading && <Spinner />}
                {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
        </div>
    );
};

const ImageGenerator: React.FC = () => {
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('A photorealistic image of a futuristic city skyline at sunset.');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!prompt) {
            setError('Please provide a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const result = await generateImageFromPrompt(prompt);
            setGeneratedImage(result);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-center w-full h-80 border-2 border-gray-600 rounded-lg bg-gray-800">
                {isLoading && <Spinner />}
                {generatedImage && !isLoading && (
                    <img src={generatedImage} alt="Generated" className="object-contain h-full w-full rounded-lg" />
                )}
                {!isLoading && !generatedImage && (
                    <div className="text-gray-500">Generated image will appear here</div>
                )}
            </div>
            
            <div className="space-y-2">
                <label htmlFor="gen-prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
                <textarea
                    id="gen-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A majestic lion overlooking the savanna..."
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                />
            </div>
            
            {error && <div className="p-4 text-sm text-red-400 bg-red-900/50 rounded-lg">{error}</div>}

            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isLoading && <Spinner />}
                {isLoading ? 'Generating...' : 'Generate New Image'}
            </button>
        </div>
    );
};


function App() {
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  const TabButton: React.FC<{ tabName: Tab; label: string }> = ({ tabName, label }) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tabName
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-700'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">AI Image Studio</h1>
        </header>

        <div className="bg-gray-800/50 p-2 rounded-lg backdrop-blur-sm border border-gray-700 mb-6">
            <div className="flex justify-center space-x-2">
                <TabButton tabName="editor" label="Image Editor" />
                <TabButton tabName="generator" label="Image Generator" />
            </div>
        </div>

        <main className="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm border border-gray-700 shadow-2xl">
            {activeTab === 'editor' ? <ImageEditor /> : <ImageGenerator />}
        </main>

        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
}

export default App;