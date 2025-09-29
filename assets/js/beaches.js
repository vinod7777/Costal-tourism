export const beaches = {
  "beaches_in_india": [
    {
      "name": "Puri Beach",
      "state_ut": "Odisha",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Pati Sonepur Sea Beach",
      "state_ut": "Odisha",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Rushikonda Beach",
      "state_ut": "Andhra Pradesh",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Kovalam Beach",
      "state_ut": "Tamil Nadu",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Eden Beach",
      "state_ut": "Puducherry",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Radhanagar Beach",
      "state_ut": "Andaman and Nicobar Islands",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Minicoy Thundi beach",
      "state_ut": "Lakshadweep",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Kadmat beach",
      "state_ut": "Lakshadweep",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Kappad beach",
      "state_ut": "Kerala",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Kasarkod beach",
      "state_ut": "Karnataka",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Padubidri Beach",
      "state_ut": "Karnataka",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Ghoghla beach",
      "state_ut": "Diu",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Shivrajpur beach",
      "state_ut": "Gujarat",
      "notes": "Blue Flag beach"
    },
    {
      "name": "Tithal Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Dumas Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Suvali Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Umbharat Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Dandi Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Dabhari beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Diu Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Mandavi Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Khambhat Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Devka Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Oakha Madhi Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Jampore Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Moti Daman Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Nani Daman Beach",
      "state_ut": "Gujarat"
    },
    {
      "name": "Nagao Beach",
      "state_ut": "Gujarat"
    },
    {
      "name":.join('');

    // Populate Activity Filter
    activityFilterOptions.innerHTML = ['All', ...activities].map(activity =>
        `<a href="#" class="block px-4 py-2 text-sm hover:bg-primary/10" data-value="${activity}">${activity}</a>`
    ).join('');


    // Event Listeners
    searchInput.addEventListener('input', applyFilters);

    stateFilterButton.addEventListener('click', () => {
        stateFilterOptions.classList.toggle('hidden');
    });

    activityFilterButton.addEventListener('click', () => {
        activityFilterOptions.classList.toggle('hidden');
    });

    stateFilterOptions.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            selectedState = e.target.dataset.value;
            stateFilterLabel.textContent = selectedState;
            stateFilterOptions.classList.add('hidden');
            applyFilters();
        }
    });

    activityFilterOptions.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            selectedActivity = e.target.dataset.value;
            activityFilterLabel.textContent = selectedActivity;
            activityFilterOptions.classList.add('hidden');
            applyFilters();
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!stateFilterContainer.contains(e.target)) {
            stateFilterOptions.classList.add('hidden');
        }
        if (!activityFilterContainer.contains(e.target)) {
            activityFilterOptions.classList.add('hidden');
        }
    });


    // Initial render
    applyFilters();
});
