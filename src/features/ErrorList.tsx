export const ErrorList = ({ errors }: { readonly errors: readonly string[] }) =>
  errors.length > 0 && (
    <ul className="errors" role="alert">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
