interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  link?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function ActionCard({
  title,
  description,
  icon,
  link,
  disabled,
  onClick,
  children,
}: ActionCardProps & { children?: React.ReactNode }) {
  const baseClasses = 'bg-white rounded-lg shadow p-6 transition-all';
  const enabledClasses =
    'hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-blue-500';
  const disabledClasses = 'opacity-60 cursor-not-allowed bg-gray-50';

  const content = (
    <>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      {disabled && (
        <span className="inline-block mt-3 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
          Coming soon
        </span>
      )}
      {children}
    </>
  );

  if (link && !disabled) {
    return (
      <a href={link} className={`${baseClasses} ${enabledClasses} block`}>
        {content}
      </a>
    );
  }

  return (
    <div
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      onClick={disabled ? undefined : onClick}
      role={onClick && !disabled ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-disabled={disabled}
    >
      {content}
    </div>
  );
}
