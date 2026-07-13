const fs = require('fs');
const path = require('path');

const files = [
  {
    file: 'monk_handler.go',
    struct: 'MonkHandler',
    service: 'monkService',
    entityName: 'Monk',
    slugMethodExists: true
  },
  {
    file: 'gallery_handler.go',
    struct: 'GalleryHandler',
    service: 'galleryService',
    entityName: 'Gallery',
    slugMethodExists: false
  },
  {
    file: 'schedule_handler.go',
    struct: 'ScheduleHandler',
    service: 'scheduleService',
    entityName: 'Schedule',
    slugMethodExists: false
  },
  {
    file: 'donation_handler.go',
    struct: 'DonationHandler',
    service: 'donationService',
    entityName: 'Donation',
    slugMethodExists: false
  }
];

const basePath = path.join(__dirname, 'internal', 'handlers');

files.forEach(f => {
  const filepath = path.join(basePath, f.file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (content.includes(`Get${f.entityName}ByID`)) return;

  const funcCode = `
// Get${f.entityName}ByID - Admin: Get single ${f.entityName.toLowerCase()} by ID
func (h *${f.struct}) Get${f.entityName}ByID(c *fiber.Ctx) error {
	id, err := utils.ParseID(c, "id")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}
	item, err := h.${f.service}.GetByID(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "${f.entityName} not found")
	}
	return utils.SuccessResponse(c, item)
}
`;

  // Insert before Update...
  content = content.replace(`func (h *${f.struct}) Update`, funcCode.trim() + `\n\nfunc (h *${f.struct}) Update`);
  fs.writeFileSync(filepath, content);
});

// Now update routes.go
const routesPath = path.join(__dirname, 'internal', 'routes', 'routes.go');
let routesContent = fs.readFileSync(routesPath, 'utf8');

const routeReplacements = [
  { match: 'admin.Post("/monks"', insert: 'admin.Get("/monks/:id", middleware.PermissionRequired("monks", "read"), monkHandler.GetMonkByID)\n\t' },
  { match: 'admin.Post("/gallery"', insert: 'admin.Get("/gallery/:id", middleware.PermissionRequired("gallery", "read"), galleryHandler.GetGalleryByID)\n\t' },
  { match: 'admin.Post("/schedules"', insert: 'admin.Get("/schedules/:id", middleware.PermissionRequired("schedules", "read"), scheduleHandler.GetScheduleByID)\n\t' },
  { match: 'admin.Get("/donations/stats"', insert: 'admin.Get("/donations/:id", middleware.PermissionRequired("donations", "read"), donationHandler.GetDonationByID)\n\t' }
];

routeReplacements.forEach(r => {
  if (!routesContent.includes(r.insert.trim())) {
    routesContent = routesContent.replace(r.match, r.insert + r.match);
  }
});

fs.writeFileSync(routesPath, routesContent);
console.log("Handlers and routes patched successfully");
