import React from 'react'

const Tags = ({ tags, limit = 10 }) => {
  // Respect the limit and sort by timestamp if available
  const limitedTags = tags
    ?.slice()
    .sort((a, b) => {
      // Sort by timestamp descending if available
      if (a.timestamp && b.timestamp) {
        return b.timestamp.seconds - a.timestamp.seconds;
      }
      return 0;
    })
    .slice(0, limit);

  return (
    <div>
      <div>
        <div className="blog-heading text-start py-2 mb-4">Recent Posts</div>
      </div>

      <div className="tags">
        {limitedTags?.map((tag, index) => (
          <p className='tag' key={index}>
            {tag}
          </p>
        ))}
      </div>
    </div>
  )
}

export default Tags