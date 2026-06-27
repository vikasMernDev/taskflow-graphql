export default function Card({ title, subtitle, className = "", children, ...props }) {
  return (
    <section className={`card ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3>{title}</h3>}
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
