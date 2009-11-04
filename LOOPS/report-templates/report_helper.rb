PICK_N_CLASS = java.lang.Class::for_name("org.concord.otrunk.intrasession.OTMultiUserPickN")
POLL_CLASS = java.lang.Class::for_name("org.concord.otrunk.intrasession.OTMultiUserPollingGraph")
DOC_CLASS = java.lang.Class::for_name("org.concord.otrunk.view.document.OTDocument")
CARD_CLASS = java.lang.Class::for_name("org.concord.otrunk.ui.OTCardContainer")
OVERLAY_CLASS = java.lang.Class::for_name("org.concord.otrunk.overlay.OTOverlayWrapper")
MULTI_CLASS = java.lang.Class::for_name("org.concord.otrunk.intrasession.OTMultiUser")
SECTION_CLASS = java.lang.Class::for_name("org.concord.otrunk.ui.OTSection")
GROUP_MANAGER_CLASS = java.lang.Class::for_name("org.concord.otrunk.view.OTGroupListManager")

#################################################
##
#################################################
def getClassString(klass)
  if PICK_N_CLASS.is_assignable_from(klass)
    "Pick N"
  elsif POLL_CLASS.is_assignable_from(klass)
    "Poll"
  else
    type.to_s
  end
end


def class_name() 
    Java::JavaLang::System.getProperty("report.class.name", "unknown class")
end


def teacher_name() 
    Java::JavaLang::System.getProperty("report.teacher.name", "unknown teacher")
end


def get_activities() 
  activities = {}
  objects = @otrunk.getAllObjects(MULTI_CLASS)
  objects.each do |multi_user|
    next if multi_user.object == nil
    wrapper_otid_paths = @otrunk.getIncomingReferences(multi_user.object.global_id, OVERLAY_CLASS, true)
    next if wrapper_otid_paths.size < 1
    first_path = wrapper_otid_paths[0]
    section_otid_paths = @otrunk.getIncomingReferences(first_path[first_path.size-1].source,  SECTION_CLASS, true)
    section_otid_paths.each do |section_path|
      step_indexes = []
      section = @otrunk.root_object_service.getOTObject(section_path[section_path.size - 1].source)
      section.name ||= "Unknown Activity"
      # get the index of the section in the overall project
      # puts "Finding card container parents of section #{section.name}"
      proj_otid_paths = @otrunk.getIncomingReferences(section.getGlobalId(), CARD_CLASS, true)
      # take the first one
      section_index = -1
      # puts "#{proj_otid_paths.size} card containers found wrapping the section #{section.name}"
      proj_otid_paths.each do |proj_path|
        next if section_index != -1
        # puts "Checking: #{proj_path[proj_path.size-1].source}"
        card_container = @otrunk.root_object_service.getOTObject(proj_path[proj_path.size-1].source)
        # figure out what step this is
        i = 0
        card_container.cards.each do |card|
          i += 1
          if section.equals(card)
            section_index = i
          end
        end
      end
      section_path.each do |reference|
        source = @otrunk.root_object_service.getOTObject(reference.source)
        if CARD_CLASS.is_assignable_from(source.get_class)
          dest = @otrunk.root_object_service.getOTObject(reference.dest)
          if DOC_CLASS.is_assignable_from(dest.get_class)
            # figure out what step this is
            i = 0
            source.cards.each do |card|
              i += 1
              if reference.dest.equals(card.getGlobalId())
                step_indexes.unshift(i)
              end
            end
          end
        end
      end
      # now that weve figured out the full path to the object, save the info
      activities[section] ||= {}
      activities[section]["index"] = section_index
      activities[section][step_indexes] ||= []
      activities[section][step_indexes] << multi_user
    end
  end
  return activities
end



