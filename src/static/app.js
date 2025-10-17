document.addEventListener("DOMContentLoaded", () => {
  // Delegate click event for delete icons
  activitiesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (target.classList.contains("delete-icon")) {
      const activity = target.getAttribute("data-activity");
      const email = target.getAttribute("data-email");
      if (activity && email) {
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
            method: "POST"
          });
          const result = await response.json();
          if (response.ok) {
            messageDiv.textContent = result.message || "Participant unregistered.";
            messageDiv.className = "message success";
            await fetchActivities();
          } else {
            messageDiv.textContent = result.detail || "Failed to unregister participant.";
            messageDiv.className = "message error";
          }
        } catch (error) {
          messageDiv.textContent = "Error unregistering participant.";
          messageDiv.className = "message error";
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => {
          messageDiv.classList.add("hidden");
        }, 4000);
      }
    }
  });
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to show nicer names from emails (e.g. "jane.doe@..." -> "Jane Doe")
  function formatParticipantName(email) {
    try {
      const namePart = email.split("@")[0];
      const parts = namePart.split(/[\.\-_]/).filter(Boolean);
      const titled = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return titled.join(" ");
    } catch {
      return email;
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select options but keep the default placeholder
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHTML = `<div class="participants"><strong>Participants</strong>`;
        if (details.participants && details.participants.length > 0) {
          participantsHTML += '<div class="participants-list">';
          details.participants.forEach((email) => {
            const displayName = formatParticipantName(email);
            participantsHTML += `<div class="participant-item" title="${email}">
              <span class="participant-name">${displayName}</span>
              <span class="delete-icon" title="Unregister" data-activity="${name}" data-email="${email}" style="cursor:pointer;margin-left:8px;" aria-label="Delete participant">🗑️</span>
            </div>`;
          });
          participantsHTML += '</div>';
        } else {
          participantsHTML += `<p class="no-participants">No participants yet — be the first!</p>`;
        }
        participantsHTML += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // use both 'message' and status class so styles defined earlier apply
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities and dropdown to show the new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
