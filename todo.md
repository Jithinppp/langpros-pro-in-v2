## Inventory manager

- user able to login and logout ✅
- take to right route and dashboard✅
- user able to see all the equipments in the inventory with pagination and search functionality✅
- user able to click and see single equipment and edit, delete equipment ✅
- single equipment edit status should disable and also serial no is not required ✅
- add pagination to manage-[category, subcategory, models] ✅
- add bulk csv import ✅
- fix the scrollbar issue everywhere ✅
- add filters in the search bar ✅
- user able to discard item (add soft delete is_active flag) ✅
- show all items based on is_active flag in /equipments (soft deleted or not) ✅
- make sure the data structure is correct for every table ✅
- add a archive page for history or deleted items ✅
- add a user history tracker what are the things he done like a log (user did xx in xx time xx day) ✅
- deletion of categories and subcategories and models should also delete the items related to FK ✅ need to fix
- use headless ui dropdown and also add codes in filter
- add log maintenance (last and next maintenance)

## Project manager

## design rules

input py-2.5
rounded-lg
page width and bg main div --> min-h-screen font-sans p-4 py-12
sub div --> w-full mx-auto rounded-2xl overflow-hidden
sub div --> p-6 md:p-10
