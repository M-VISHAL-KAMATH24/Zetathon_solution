function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleOtherService(selectElement) {
    const otherServiceInput = document.getElementById('other-service');
    otherServiceInput.style.display = selectElement.value === 'other' ? 'block' : 'none';
}
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
     }
        }