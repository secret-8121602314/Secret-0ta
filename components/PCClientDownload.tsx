import React, { useState, useEffect } from 'react';
import { githubReleasesService, GitHubRelease } from '../services/githubReleasesService';
import Button from './ui/Button';

interface PCClientDownloadProps {
  variant?: 'button' | 'link' | 'card';
  className?: string;
  showVersion?: boolean;
  showReleaseNotes?: boolean;
}

const PCClientDownload: React.FC<PCClientDownloadProps> = ({
  variant = 'button',
  className = '',
  showVersion = true,
  showReleaseNotes = false
}) => {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReleaseDetails, setShowReleaseDetails] = useState(false);

  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        setLoading(true);
        setError(null);
        const latestRelease = await githubReleasesService.getLatestRelease();
        setRelease(latestRelease);
      } catch (err) {
        setError('Failed to fetch latest version');
        console.error('Error fetching release:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestRelease();
  }, []);

  const handleDownload = () => {
    // Hardcoded download URL for the specific file
    const downloadUrl = 'https://github.com/readmet3xt/otakon-pc-client/releases/download/v1.0.0/Otakon.Connector.Setup.1.0.0.exe';
    window.open(downloadUrl, '_blank');
  };

  const handleViewReleases = () => {
    window.open(`https://github.com/${githubReleasesService['REPO_OWNER']}/${githubReleasesService['REPO_NAME']}/releases`, '_blank');
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleDownload}
          className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-4 py-2 rounded-md font-medium hover:brightness-110 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PC Client
          {showVersion && (
            <span className="text-xs opacity-80">
              (v1.0.0)
            </span>
          )}
        </button>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleDownload}
          className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-4 py-2 rounded-md font-medium hover:brightness-110 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PC Client
          {showVersion && (
            <span className="text-xs opacity-80">
              (v1.0.0)
            </span>
          )}
        </button>
      </div>
    );
  }

  const downloadButtonText = githubReleasesService.getDownloadButtonText();

  if (variant === 'link') {
    return (
      <div className={`${className}`}>
        <a
          href="https://github.com/readmet3xt/otakon-pc-client/releases/download/v1.0.0/Otakon.Connector.Setup.1.0.0.exe"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#FF4D4D] hover:text-[#FF4D4D] hover:underline transition-colors"
        >
          {downloadButtonText}
          {showVersion && (
            <span className="ml-1 text-xs opacity-80">
              ({githubReleasesService.formatVersion(release.version)})
            </span>
          )}
        </a>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-[#2E2E2E] border border-[#424242] rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#F5F5F5]">PC Client</h3>
          {showVersion && (
            <span className="text-sm text-[#A3A3A3] bg-[#1C1C1C] px-2 py-1 rounded">
              {githubReleasesService.formatVersion(release.version)}
            </span>
          )}
        </div>
        
        <p className="text-sm text-[#A3A3A3] mb-3">
          Latest version released {githubReleasesService.formatDate(release.publishedAt)}
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              const downloadUrl = 'https://github.com/readmet3xt/otakon-pc-client/releases/download/v1.0.0/Otakon.Connector.Setup.1.0.0.exe';
              window.open(downloadUrl, '_blank');
            }}
            className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-4 py-2 rounded-md font-medium hover:brightness-110 transition-all"
          >
            Download PC Client
          </button>
          
          {showReleaseNotes && (
            <button
              onClick={() => setShowReleaseDetails(!showReleaseDetails)}
              className="px-4 py-2 bg-[#1C1C1C] border border-[#424242] text-[#CFCFCF] rounded-md hover:bg-[#2E2E2E] transition-colors"
            >
              {showReleaseDetails ? 'Hide' : 'Show'} Notes
            </button>
          )}
        </div>
        
        {showReleaseNotes && showReleaseDetails && (
          <div className="mt-3 p-3 bg-[#1C1C1C] border border-[#424242] rounded-md">
            <h4 className="text-sm font-medium text-[#F5F5F5] mb-2">Release Notes:</h4>
            <p className="text-xs text-[#A3A3A3] whitespace-pre-wrap">
              {release.releaseNotes}
            </p>
          </div>
        )}
        
        <div className="mt-3 text-center">
          <button
            onClick={handleViewReleases}
            className="text-xs text-[#6E6E6E] hover:text-[#A3A3A3] transition-colors"
          >
            View all releases on GitHub
          </button>
        </div>
      </div>
    );
  }

  // Default button variant
  return (
    <div className={`${className}`}>
      <Button
        onClick={handleDownload}
        variant="secondary"
        size="lg"
        fullWidth
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download PC Client
        {showVersion && (
          <span className="text-xs opacity-80">
            (v1.0.0)
          </span>
        )}
      </Button>
    </div>
  );
};

export default PCClientDownload;
