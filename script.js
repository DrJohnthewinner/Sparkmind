// Navigation Functions for index.html (Grade Selection)
function selectGrade(grade) {
  // Store the selected grade
  localStorage.setItem('selectedGrade', grade);
  // Redirect to the subjects page
  window.location.href = 'subjects.html';
}

// Navigation Functions for subjects.html (Subject Selection)
function goBackToGradesPage() {
  window.location.href = 'index.html';
}

function navigateToSubjectPage(subjectId) {
  // Redirect to note.html and pass the subjectId as a query parameter
  window.location.href = `note.html?subject=${subjectId}`;
}

document.addEventListener('DOMContentLoaded', function() {
  // This block can remain as a placeholder for future DOM manipulations
});