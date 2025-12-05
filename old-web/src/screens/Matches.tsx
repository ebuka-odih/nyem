import { MainLayout } from '@/components/MainLayout';

/**
 * Matches Screen
 * Display matched items/users
 */
const Matches = () => {
  // Mock matches data
  const matches = [
    {
      id: 1,
      title: 'iPhone 13 Pro',
      condition: 'Like New',
      matchedWith: 'John Doe',
      image: 'https://via.placeholder.com/200x200?text=iPhone',
    },
    {
      id: 2,
      title: 'MacBook Air',
      condition: 'Good',
      matchedWith: 'Jane Smith',
      image: 'https://via.placeholder.com/200x200?text=MacBook',
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div
        style={{
          paddingTop: '16px',
          paddingBottom: '12px',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#222222',
            lineHeight: '1.2',
          }}
        >
          Matches
        </h1>
      </div>

      {/* Matches List */}
      <div
        style={{
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '100px',
          paddingTop: '8px',
        }}
      >
        {matches.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              paddingTop: '80px',
            }}
          >
            <p
              style={{
                fontSize: '18px',
                color: '#666666',
                textAlign: 'center',
                marginBottom: '8px',
              }}
            >
              No matches yet
            </p>
            <p
              style={{
                fontSize: '14px',
                color: '#999999',
                textAlign: 'center',
              }}
            >
              Start swiping to find matches!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
                style={{
                  borderColor: '#E0E0E0',
                }}
              >
                <div className="flex">
                  {/* Image */}
                  <div
                    className="w-24 h-24 flex-shrink-0"
                    style={{
                      backgroundColor: '#F5F5F5',
                    }}
                  >
                    <img
                      src={match.image}
                      alt={match.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div
                    className="flex-1 flex flex-col justify-between"
                    style={{
                      padding: '16px',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#222222',
                          marginBottom: '4px',
                        }}
                      >
                        {match.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#999999',
                          marginBottom: '8px',
                        }}
                      >
                        Matched with {match.matchedWith}
                      </p>
                    </div>
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-semibold self-start"
                      style={{
                        backgroundColor: '#E8F5E9',
                        color: '#2E7D32',
                      }}
                    >
                      {match.condition}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Matches;

