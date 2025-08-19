// Enhanced URL processing specifically for embeddable content like Airtable
export interface ProcessedUrl {
  original: string;
  processed: string;
  isValid: boolean;
  type: 'airtable' | 'generic' | 'invalid';
  errors: string[];
}

export const processUrl = (input: string): ProcessedUrl => {
  const result: ProcessedUrl = {
    original: input,
    processed: '',
    isValid: false,
    type: 'invalid',
    errors: []
  };

  if (!input || typeof input !== 'string') {
    result.errors.push('URL is empty or invalid');
    return result;
  }

  let url = input.trim();

  // Extract URL from iframe HTML if present
  const iframeMatch = url.match(/src="([^"]+)"/);
  if (iframeMatch) {
    url = iframeMatch[1];
    console.log('🔧 URL Processor: Extracted URL from iframe HTML:', url);
  }

  // Clean and validate URL
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Validate URL format
  try {
    new URL(url);
    result.isValid = true;
    result.processed = url;
  } catch (e) {
    result.errors.push('Invalid URL format');
    return result;
  }

  // Detect URL type and optimize for embedding
  if (url.includes('airtable.com')) {
    result.type = 'airtable';
    
    // Ensure Airtable URL is in embed format
    if (url.includes('/embed/')) {
      result.processed = url;
    } else if (url.includes('airtable.com/')) {
      // Try to convert regular Airtable URL to embed format
      const embedUrl = url.replace('airtable.com/', 'airtable.com/embed/');
      result.processed = embedUrl;
      console.log('🔧 URL Processor: Converted Airtable URL to embed format:', embedUrl);
    }
  } else {
    result.type = 'generic';
    result.processed = url;
  }

  console.log('🔧 URL Processor: Final result:', result);
  return result;
};

export const validateEmbedUrl = (url: string): boolean => {
  const processed = processUrl(url);
  return processed.isValid;
};