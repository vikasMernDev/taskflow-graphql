export default function Card({ title, subtitle, headingLevel = "h2", className = "", children, ...props }) {
  const Heading = headingLevel;

  return (
    <section className={`card ${className}`.trim()} {...props}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <Heading>{title}</Heading>}
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
