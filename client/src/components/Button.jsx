export default function Button({ variant = "primary", className = "", children, ...props }) {
  const variantClass = variant === "secondary" ? "secondary" : variant === "danger" ? "danger" : "primary";

  return (
    <button className={`button ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
