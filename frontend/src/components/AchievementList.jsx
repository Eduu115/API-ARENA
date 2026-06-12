import {
  TIER_LABEL,
  TIER_STYLE,
  achievementIcon,
  achievementTierVars,
} from '../lib/achievementDisplay';

export default function AchievementList({ achievements, emptyMessage = 'No achievements yet.' }) {
  if (!achievements?.length) {
    return <p className="profile-ach-empty">{emptyMessage}</p>;
  }

  return (
    <div className="profile-ach-grid">
      {achievements.map((a) => {
        const tier = a.tier || 'COMMON';
        const ts = TIER_STYLE[tier] || TIER_STYLE.COMMON;
        const locked = !a.unlocked;
        const tierKey = tier.toLowerCase();
        return (
          <div
            key={a.code}
            className={[
              'profile-ach',
              `profile-ach--tier-${tierKey}`,
              locked ? 'profile-ach--locked' : 'profile-ach--unlocked',
            ].join(' ')}
            style={achievementTierVars(tier)}
          >
            <div
              className={`profile-ach-glyph${locked ? ' profile-ach-glyph--locked' : ''}`}
              aria-hidden
              style={locked ? undefined : { color: ts.color }}
            >
              {locked ? '◌' : achievementIcon(a.iconKey)}
            </div>
            <div className="profile-ach-main">
              <div className="profile-ach-top">
                <div className="profile-ach-top-tags">
                  <span
                    className="profile-ach-tier"
                    style={locked ? undefined : { color: ts.color }}
                  >
                    {TIER_LABEL[tier] || tier}
                  </span>
                  {locked ? (
                    <span className="profile-ach-state profile-ach-state--locked">Locked</span>
                  ) : (
                    <span className="profile-ach-state profile-ach-state--unlocked">Unlocked</span>
                  )}
                </div>
                {!locked && a.unlockedAt && (
                  <time className="profile-ach-when" dateTime={a.unlockedAt}>
                    {new Date(a.unlockedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                )}
              </div>
              <div className="profile-ach-name">{a.title}</div>
              <p className="profile-ach-desc">{a.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
