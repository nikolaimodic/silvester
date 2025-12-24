// Target date: January 1, 2026, 00:00:00 Berlin Time (CET/CEST)
let countdownInterval;
let currentImageSrc = '';
let currentImageName = '';

function getTimeInBerlin() {
    // Get current time components in Berlin timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const getValue = (type) => parseInt(parts.find(p => p.type === type).value);
    
    return {
        year: getValue('year'),
        month: getValue('month') - 1, // JavaScript months are 0-indexed
        day: getValue('day'),
        hour: getValue('hour'),
        minute: getValue('minute'),
        second: getValue('second')
    };
}

function getTargetUTC() {
    // Target: January 1, 2026, 00:00:00 Berlin time
    // In January, Berlin uses CET (UTC+1), so midnight Berlin = 23:00 UTC on Dec 31, 2025
    // However, to be more accurate, we'll calculate it dynamically
    
    // Create a date that represents Jan 1, 2026 00:00 in a timezone-aware way
    // We'll use the fact that we can create a date and then check what UTC time
    // corresponds to midnight Berlin time on that date
    
    // January 1, 2026 at midnight Berlin time
    // Since it's winter, Berlin is in CET (UTC+1)
    // So the UTC equivalent is Dec 31, 2025 23:00:00 UTC
    return new Date(Date.UTC(2025, 11, 31, 23, 0, 0));
}

function updateCountdown() {
    const now = new Date();
    const targetUTC = getTargetUTC();
    
    // Calculate difference
    const difference = targetUTC - now;
    
    if (difference <= 0) {
        // Countdown reached zero
        clearInterval(countdownInterval);
        showGallery();
        return;
    }
    
    // Calculate time units
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    // Format with leading zeros
    const formattedDays = String(days).padStart(2, '0');
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    // Update display
    document.getElementById('countdown').textContent = 
        `${formattedDays}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function showGallery() {
    const countdownContainer = document.getElementById('countdown-container');
    const galleryContainer = document.getElementById('gallery-container');
    
    countdownContainer.classList.add('hidden');
    galleryContainer.classList.remove('hidden');
}

function viewFullImage(imageSrc) {
    currentImageSrc = imageSrc;
    const modal = document.getElementById('image-modal');
    const fullImage = document.getElementById('full-image');
    
    // Fix image paths to use correct extensions
    fullImage.src = imageSrc;
    fullImage.onerror = function() {
        // If image fails to load, try alternative extensions
        const basePath = imageSrc.substring(0, imageSrc.lastIndexOf('.'));
        const extensions = ['.JPG', '.jpg', '.PNG', '.png', '.JPEG', '.jpeg'];
        let tried = 0;
        const tryNext = () => {
            if (tried < extensions.length) {
                fullImage.src = basePath + extensions[tried];
                tried++;
            }
        };
        tryNext();
    };
    
    modal.classList.remove('hidden');
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function downloadImage(imageSrc, imageName) {
    currentImageSrc = imageSrc;
    currentImageName = imageName;
    
    try {
        // Fetch the image as a blob
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = imageName;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Error downloading image:', error);
        // Fallback to direct link if fetch fails
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = imageName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function downloadFromModal() {
    if (currentImageSrc) {
        const fullImage = document.getElementById('full-image');
        const imageSrc = fullImage.src || currentImageSrc;
        const imageName = imageSrc.split('/').pop() || 'image.jpg';
        downloadImage(imageSrc, imageName);
    }
}

// Close modal when clicking outside the image
document.addEventListener('click', function(event) {
    const modal = document.getElementById('image-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('image-modal');
        if (!modal.classList.contains('hidden')) {
            closeModal();
        }
    }
});

// Initialize countdown
updateCountdown();
countdownInterval = setInterval(updateCountdown, 1000);

// Check if countdown has already passed on page load
const targetUTC = getTargetUTC();
if (new Date() >= targetUTC) {
    showGallery();
}
