const getErrorTrace = (error: object) => {
  Error.captureStackTrace(error, getErrorTrace);
};

export default getErrorTrace;
