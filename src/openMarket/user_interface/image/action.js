export const IMAGE_FETCH_PROGRESSED = 'IMAGE_FETCH_PROGRESSED';
export const IMAGE_FETCH_FINISHED = 'IMAGE_FETCH_FINISHED';

export const imageFetchProgressed = percent => ({type: IMAGE_FETCH_PROGRESSED, percent});
export const imageFetchFinished = () => ({type: IMAGE_FETCH_FINISHED});
