function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>{statusCode ? `${statusCode}` : 'An error occurred'}</h1>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
