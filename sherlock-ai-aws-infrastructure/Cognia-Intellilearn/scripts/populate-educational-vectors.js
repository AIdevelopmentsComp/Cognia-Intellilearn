const { S3VectorsService } = require('../lib/services/s3VectorsService')

async function populateVectors() {
  console.log('🚀 Starting Educational Vectors Population...\n')
  
  try {
    await S3VectorsService.populateEducationalVectors()
    console.log('\n✅ Educational vectors populated successfully!')
    
    // Test the search functionality
    console.log('\n🔍 Testing semantic search...')
    const testQuery = 'project management basics'
    const results = await S3VectorsService.querySimilarContent(testQuery, 'intermediate', 'business', 3)
    
    console.log(`\nSearch results for "${testQuery}":`)
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.metadata.topic} (similarity: ${result.similarity.toFixed(3)})`)
      console.log(`   ${result.content.slice(0, 100)}...`)
    })
    
    // Test context retrieval
    console.log('\n📚 Testing context retrieval...')
    const context = await S3VectorsService.getEducationalContext('project management', 'intermediate', 'en')
    console.log(`\nContext fragments for "project management":`)
    context.forEach((fragment, index) => {
      console.log(`${index + 1}. ${fragment.slice(0, 150)}...`)
    })
    
  } catch (error) {
    console.error('💥 Error populating vectors:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  populateVectors()
    .then(() => {
      console.log('\n🎉 Vector population completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Vector population failed:', error)
      process.exit(1)
    })
}

module.exports = { populateVectors } 