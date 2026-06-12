import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
    options: any;
    onReady?: (player: any) => void;
    className?: string;
}

export const VideoPlayer = (props: VideoPlayerProps) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const { options, onReady, className } = props;

    useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            const videoElement = document.createElement("video-js");
            videoElement.classList.add('video-js');
            videoElement.classList.add('vjs-big-play-centered');
            videoElement.classList.add('vjs-theme-city'); // Optional: can try different themes or just default

            if (videoRef.current) {
                videoRef.current.appendChild(videoElement);
            }

            const player = playerRef.current = videojs(videoElement, {
                ...options,
                controls: true, // Force controls to be true
            }, () => {
                onReady && onReady(player);
            });
        } else {
            const player = playerRef.current;

            player.autoplay(options.autoplay);
            if (options.sources && options.sources.length > 0) {
                const currentSrc = player.src();
                const newSrc = options.sources[0].src;
                // Only update src if it's actually different to prevent reset to 0:00
                if (currentSrc !== newSrc) {
                    player.src(options.sources);
                }
            }
        }
    }, [options, videoRef]);

    // Dispose the player on unmount
    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div data-vjs-player className={`${className} h-full w-full`}>
            <div ref={videoRef} className="h-full w-full" />
        </div>
    );
}

export default VideoPlayer;
