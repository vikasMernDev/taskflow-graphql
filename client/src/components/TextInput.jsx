export default function TextInput({ label, className = "", children, ...props }) {
  return (
    <label className={`field-label ${className}`}>
      {label}
      {children ? children : <input {...props} />}
    </label>
  );
}
